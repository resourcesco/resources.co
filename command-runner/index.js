import shortid from 'shortid'
import { splitPath, joinPath } from 'vtv'
import commands from '../commands'
import { store } from '../store'

const inputMessage = message => ({
  type: 'input',
  text: message,
})

const getGlobalCommandHelp = () => {
  let result = []
  for (let command of Object.keys(commands)) {
    const cmd = commands[command]
    const help = cmd.help
    if (Array.isArray(help)) {
      for (let value of help) {
        result.push({ ...value, command })
      }
    } else if (typeof help === 'string') {
      result.push({ params: cmd.params, details: cmd.help, command })
    } else if (help) {
      result.push({ ...help, command })
    } else if (cmd.actions) {
      result.push({
        command,
        details: `run ${command} commands (see \`${command} help\`)`,
      })
    }
  }
  return result
}

export let globalCommandHelp = getGlobalCommandHelp()

const convertToArray = value => {
  return Array.isArray(value) ? value : value ? [value] : []
}

const messagesByType = (messages, type) => {
  return convertToArray(messages).filter(({ type: _type }) => _type === type)
}

const getCommandEnv = commandName => {
  const result = {}
  const prefix = `${commandName.toUpperCase()}_`
  for (let key of Object.keys(store.env).filter(key =>
    key.startsWith(prefix)
  )) {
    result[key.substr(prefix.length).toLowerCase()] = store.env[key]
  }
  return result
}

const updateCommandEnv = (commandName, envUpdates) => {
  if (envUpdates.length > 0) {
    for (let { value: messageValue } of envUpdates) {
      for (let key of Object.keys(messageValue)) {
        const envKey = `${commandName}_${key}`.toUpperCase().replace('-', '_')
        store.env[envKey] = messageValue[key]
      }
    }
    store.save()
  }
}

const runAction = async ({
  resourcePath,
  actionName,
  root,
  params,
  store,
  message,
  formData,
  formCommandId,
}) => {
  if (actionName === 'help') {
    const help = [
      {
        command: `${joinPath(resourcePath)} help`,
        params: [],
        details: `show help for ${joinPath(resourcePath)} commands`,
      },
    ]
    for (let key of Object.keys(root.actions).filter(s => !s.startsWith('_'))) {
      const command = key
      const cmd = root.actions[key]
      help.push({
        params: cmd.params,
        details: cmd.help,
        command: `${joinPath(resourcePath)} ${key}`,
      })
    }
    return [{ type: 'help', help }]
  }

  if (!root.actions[actionName]) {
    return {
      type: 'text',
      text: `Unknown action. Run \`${joinPath(
        resourcePath
      )} help\` to see the available actions.`,
    }
  }
  const action = {
    ...root.actions[actionName],
    name: actionName,
  }

  const paramsByName = {}
  if (params.length !== action.params.length) {
    return { type: 'text', text: 'Invalid number of arguments.' }
  }
  for (let i = 0; i < action.params.length; i++) {
    paramsByName[action.params[i]] = params[i]
  }

  const env = getCommandEnv(resourcePath[0])
  const context = {
    store,
    message,
    formData,
    formCommandId,
    env,
    params: paramsByName,
    action,
  }

  let beforeResult
  if (root.filters && root.filters.before) {
    beforeResult = await root.filters.before(context)
    if (messagesByType(beforeResult, 'error').length) {
      return convertToArray(beforeResult)
    }
  }
  const result = await action.run(context)
  const resultArray = convertToArray(result)
  const updatedResult = resultArray.filter(({ type }) => type !== 'env')
  updateCommandEnv(
    resourcePath[0],
    resultArray.filter(({ type }) => type === 'env')
  )
  return [...convertToArray(beforeResult), ...updatedResult]
}

export default async (
  message,
  parsed,
  onMessagesCreated,
  { formData, formCommandId } = {}
) => {
  const resourcePath = splitPath(parsed[0])
  const actionName = parsed.length > 1 ? parsed[1] : '_default'

  const command = commands[resourcePath[0]] // TODO: recurse
  const commandId = shortid.generate()
  if (command) {
    const params = parsed.slice(2)
    if (formData) {
      onMessagesCreated([
        { type: 'form-status', commandId, formCommandId, loading: true },
      ])
    } else {
      onMessagesCreated([
        { ...inputMessage(message), commandId, loading: true },
      ])
    }
    const context = {
      resourcePath,
      actionName,
      params,
      message,
      store,
      formData,
      formCommandId,
      root: command,
    }
    let result
    if (command.actions) {
      result = await runAction(context)
    } else {
      result = await command.run(context)
    }
    const outputMessages = convertToArray(result).map(message => ({
      ...message,
      commandId,
    }))
    onMessagesCreated([...outputMessages, { type: 'loaded', commandId }])
  } else {
    onMessagesCreated(
      [
        inputMessage(message),
        { type: 'text', text: 'Command not found.' },
      ].map(message => ({ ...message, commandId }))
    )
  }
}
