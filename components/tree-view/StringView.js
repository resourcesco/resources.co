export default ({value, maxLength}) => {
  if (/\n|"|^$/.test(value)) {
    if (value.length > (maxLength - 10)) {
      return <em>{JSON.stringify(value.substr(0, maxLength - 10))}</em>
    } else {
      return <em>{JSON.stringify(value)}</em>
    }
  } else if (value.length > maxLength) {
    return <>{value.substr(0, maxLength)} <em>'…'</em></>
  } else {
    return value
  }
}
