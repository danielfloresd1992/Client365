
export default function blobToFileAndUrl(blobParams, callback){

    const file = new File([blobParams], `blobParams.${blobParams.type.split('/')[1]}`, { type: blobParams.type });
    const fileReader = new FileReader();

    fileReader.readAsDataURL(file);
    fileReader.onload = e => {
        callback({ file: file, base64: e.target.result, file: file });
    }
}