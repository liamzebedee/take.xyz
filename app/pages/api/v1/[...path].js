// const API_SERVER = "http://15.165.74.200"
const API_SERVER = "http://localhost:8000"

// This proxies all requests under the path https://take-xyz.vercel.app/api/v1/... to the proxy server http://localhost:8000/...
// This means we don't fuck around with CORS and HTTPS etc.

export default async function handler(req, res) {
    const { path } = req.query
    console.log(path.join('/'))

    // make a fetch request to that path.
    // include the query params, the body, etc.
    const url = `${API_SERVER}/${path.join('/')}?${new URLSearchParams(req.query)}`
    const data = await fetch(url, {
        method: req.method,
        headers: req.headers,
        body: req.method == "POST" ? JSON.stringify(req.body) : undefined
    }).then(res => res.json())

    res
        .status(200)
        .send(data)
}