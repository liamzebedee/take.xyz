import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  if(Component.layout) {
    return <Component.layout>
      <Component {...pageProps} />
    </Component.layout>
  }
  return <Component {...pageProps} />
}

export default MyApp
