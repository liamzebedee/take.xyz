// console.log(process.argv)
// const dataURI = "data:application/json;base64,ew0KICAgICJtYWx0X3R5cGUiOiAibG9nIiwNCiAgICAibWFsdF9kYXRhIjogIldvdywgdSByIGFsbW9zdCB0aGVyZSA6TyINCn0=";
const dataURI = process.argv[2]

// 29 = length of "data:application/json;base64,"
const json = atob(dataURI.substring(29));
const tokenURIJsonBlob = JSON.parse(json);

const {image} = tokenURIJsonBlob
console.log(image);



// node decode_uri.js $(cast call 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 "tokenURI(uint)" 0 | cast --to-ascii)