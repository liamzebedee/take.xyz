let API_SERVER = "http://15.165.74.200:8000/"

if(process.env.NODE_ENV != 'production') {
    API_SERVER = "http://localhost:8000"
}

// This proxies all requests under the path https://take-xyz.vercel.app/api/v1/... to the proxy server http://localhost:8000/...
// This means we don't fuck around with CORS and HTTPS etc.

export default async function handler(req, res) {
    const { path } = req.query
    const searchParams = req.query
    delete searchParams.path

    // make a fetch request to that path.
    // include the query params, the body, etc.
    const url = `${API_SERVER}/${path.join('/')}?${new URLSearchParams(searchParams)}`
    console.log(url)
    const data = await fetch(url, {
        method: req.method,
        headers: req.headers,
        body: req.method == "POST" ? JSON.stringify(req.body) : undefined
    }).then(res => res.json())

    res
        .status(200)
        .send(data)
}