import Menu, { MenuItem } from '../generic/Menu'

export default ({ onPickId, url, theme, onClose }) => {
  const pickId = () => {
    onPickId(`request get ${url}`)
  }

  const openUrl = () => {
    window.open(url, '_blank')
  }

  return (
    <Menu theme={theme} onClose={onClose}>
      {typeof onPickId === 'function' && (
        <MenuItem onClick={pickId}>Paste into console</MenuItem>
      )}
      <MenuItem onClick={openUrl}>Browse URL</MenuItem>
    </Menu>
  )
}