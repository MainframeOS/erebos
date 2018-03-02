// @flow

export default (maybeProvider?: ?Object) => {
  const provider = maybeProvider || (window.web3 && window.web3.currentProvider)
  if (provider == null) {
    throw new Error('No provider or `web3.currentProvider` exposed')
  }

  return (payload: Object): Promise<Object> =>
    new Promise((resolve, reject) => {
      provider.send(payload, (err, res) => {
        if (err) reject(err)
        else resolve(res)
      })
    })
}
