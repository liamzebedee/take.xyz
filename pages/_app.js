import Head from 'next/head'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  const Layout = Component.layout || (({ children }) => <>{children}</>)
  return <Layout>
    <Head>
      <link rel="apple-touch-icon" href="apple-touch-icon.png"></link>
    </Head>
    <Component {...pageProps} />
  </Layout>
}

export default MyApp
