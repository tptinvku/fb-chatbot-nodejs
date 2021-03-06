const tf = require('@tensorflow/tfjs-node')
const handle_data = require('./handle_data')
let lsWords = new Array()
let dictionary = handle_data.create_Dictionary()
let lsWordOfData = handle_data.ls_Word_Data()
let types =  handle_data.typeList()
// console.log(lsWordOfData)
let arrayMatrixWeights = new Array() //mảng chứa các mảng ma trận trọng số cho các câu data
let worDictTest_i = new Map()

let handle_text = (text) =>{
    let clean_text = handle_data.clean_string(text)
    let tolowercase = clean_text.toLowerCase()
    lsWords = tolowercase.split(' ')
}
let check = (text) => {
    handle_text(text)
    for(let i in lsWords){
        for(let j in dictionary){
            if(dictionary.indexOf(lsWords[i]) === -1){
                lsWords.splice(i,1)
            }else{
                break
            }
        }
    }
    if(lsWords.length<1){
        return false
    }
    return true
}
let toArrayWeightMatrix = (lsWords) => {
        for (let j in dictionary) {
            worDictTest_i.set(dictionary[j], 0);
        }

        for (let word of lsWords) {
            //cập nhật lại trọng số là số lần xuất hiện của từ trong câu
            let index = worDictTest_i.get(word);
            index += 1;
            worDictTest_i.set(word, index);
        }
        let tong_so_tu_trong_cau = handle_data.countWords(lsWords);
        // console.log(tong_so_tu_trong_cau)
        for (let word of lsWords) {
            //cập nhật lại trọng số là TF-IDF của từ trong câu
            let index = worDictTest_i.get(word);
            //tính TF
            let tf = index / tong_so_tu_trong_cau;
            //tính IDF
            //-tìm số câu chứa word
            let count = 0;
            for (let w of lsWordOfData) {
                for (let j of w) {
                    if (word === j) count++;
                }
            }
            //-IDF = số câu / sô câu có từ word;
            let idf = handle_data.totalInputs() / count;
            worDictTest_i.set(word, Number((tf * idf).toFixed(2)));
        }
        // Array.from(worDictTest_i).map(w => {
        //   console.log(w)
        // })
        let mapToArrayTest = [...worDictTest_i.values()]
        // console.log("result: " + mapToArrayTest)
        arrayMatrixWeights.push(mapToArrayTest)
        return arrayMatrixWeights

}
// this.handleMessage(text)
module.exports.predictions = async (msg) =>{
    if(check(msg)){
        console.log(lsWords)
        let data = await toArrayWeightMatrix(lsWords)
        let index = 0
        let model = await tf.loadLayersModel("file://models/models.json")
        let predictions = model
            .predict(tf.tensor2d(data))
            .argMax(1)
            .dataSync(0)
        for(let i in predictions){
            index = predictions[i]
        }
        console.log(types[index])
        return types[index]
    }
}
