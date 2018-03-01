// @flow

const HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

const METHOD = 'POST'

export default (fetch: *) => (url: string) => (data: Object) => {
  return fetch(url, {
    body: JSON.stringify(data),
    headers: HEADERS,
    method: METHOD,
  }).then(res => res.json())
}
