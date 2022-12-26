/*
UI
*/

import { useRouter } from "next/router"
import { useEffect } from "react"
import { AppLayout } from "../../../components/layout"



function UI(props) {
    // extract the query id
    const router = useRouter()
    let { id } = router.query
    console.log(id)

    useEffect(() => {
        if(id != null) {
            // split
            id = id.split("-").pop()
            window.location = `http://15.165.74.200:3000/api/t/${id}/img.png`

        }
    }, [])
}



UI.layout = AppLayout
export default UI