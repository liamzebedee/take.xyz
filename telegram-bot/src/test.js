
// Take a take and a template, and return the take with 
// the bits that were remixed (the template areas of "[xx]" and "[yy]") as bolded (surrounded by *)
// const renderRemixedTake = (take, template) => {
//     // We are trying to build a function which does this:
//     // input: take="take is currently building a telegram bot", template="take is [xx]"
//     // output: ["take is ", "currently building a telegram bot"]
    
//     const templateSpans = template
//         .split(/(\[xx\]|\[yy\])/)
//         .map(span => {
//             if (span === "[xx]" || span === "[yy]") {
//                 return { type: "template", value: span }
//             } else {
//                 return { type: "text", value: span }
//             }
//         })
//         .map(span => {
//             // add start and end.
//             if (span.type !== "template") {
//                 return { ...span, start: take.indexOf(span.value), end: take.indexOf(span.value) + span.value.length }
//             }
//             return span
//         })
    
//     console.log(templateSpans)

//     function seeker() {
//         let i = -1
//         let isInsideTemplate

//         const next = () => {
//             // isInsideTemplate = 
//         }
//     }

//     // Loop over the take.
//     // If we find a template span, then we need to bold the next bit of the take.
//     // If we don't find a template span, then we need to add the next bit of the take to the output.
//     let output = ""
//     let isInsideTemplate = false
//     for (let i = 0; i < take.length; i++) {
//         const char = take[i]

//     } 

// }

renderRemixedTake("take is currently building a telegram bot", "take is [xx] where [yy] and [xx] etc")