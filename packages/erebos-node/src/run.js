import BzzAPI from 'erebos-api-bzz-node'

const url = process.env.URL || 'https://open.swarm-gateways.net'
const bzz = new BzzAPI(url)

const data = 'Hello world'
const headers = {}

const run = async () => {
  const hash = await bzz.uploadRaw(data, headers)
  console.log(hash)
  const text = await bzz.downloadRawText(hash)
  console.log(text)
}

run().catch(console.error)
