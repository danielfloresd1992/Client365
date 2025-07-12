'use client';
import Compressor from 'compressorjs';


export default function compressAndReadImg( file, quality = 6.0, callback ){
    if (!(file instanceof File)) return callback(null, 'the first parameter must be of type blob');
    const type = [ 'image/png', 'image/jpeg' ]; 
    if(type.filter(type => type === file.type).length < 1) return callback(null, 'The file extension must be png or jpeg');
   
   
    new Compressor(file, {
        quality: quality,
        success(result) {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(result);
            fileReader.addEventListener('load', e => {
                callback({file: file, result: e.currentTarget.result}, null)
            });
          },
          error(err) {
            callback(null, err);
        },
    });
};