(() => {
    let displayImg = document.querySelector('#display-img')
    let uploadImg = document.querySelector('#upload-img')
    let downloadBtn = document.querySelector('#download-btn')
    let iconsBtn = document.querySelector('#icons-btn')
    uploadImg.addEventListener('change', (e) => {
        upload(e.target.files[0])
    })
    let upload = (file) => {
        if (file) {
            if (/image\/\w+/.test(file.type)) {
                getEXIF(file).then((res) => {
                    if (Object.keys(res).length > 0 && res.Make === 'Smartisan') {
                        let reader = new FileReader()
                        reader.onload = (e) => {
                            iconsBtn.firstElementChild.style.display = 'block'
                            iconsBtn.lastElementChild.style.display = 'none'
                            downloadBtn.setAttribute('disabled', 'disabled')
                            downloadBtn.textContent = '生成水印中...'
                            drawing(res, e.target.result, (url) => {
                                displayImg.src = downloadBtn.href = url
                                downloadBtn.download = file.name.slice(0, file.name.lastIndexOf('.'))
                                iconsBtn.firstElementChild.style.display = 'none'
                                iconsBtn.lastElementChild.style.display = 'block'
                                downloadBtn.removeAttribute('disabled')
                                downloadBtn.textContent = '下载水印照片'
                            })
                        }
                        reader.readAsDataURL(file)
                    } else {
                        toastTip('请上传Smartisan相机照片!')
                    }
                })
            } else {
                toastTip('照片格式错误!')
            }
        }

    }
    let drawing = (exif, base64, callback) => {
        let canvas = document.createElement('canvas')
        let context = canvas.getContext('2d')
        let image = new Image()
        let logo = new Image()
        let dx = 0
        let dy = 0
        let dw = exif.PixelXDimension
        let dh = exif.PixelYDimension
        let sx = exif.PixelXDimension * 0.02
        let sy = exif.PixelYDimension * 0.02
        let sw = exif.PixelXDimension * 0.96
        let sh = exif.PixelYDimension * 0.96
        let fx = exif.PixelXDimension * 0.04
        let fy = exif.PixelYDimension * 1.04
        canvas.width = exif.PixelXDimension
        canvas.height = exif.PixelYDimension + exif.PixelYDimension * 0.12
        image.onload = () => {
            context.fillStyle = '#FFFFFF'
            context.fillRect(0, 0, canvas.width, canvas.height)
            context.drawImage(image, dx, dy, dw, dh, sx, sy, sw, sh)
            // 加载字体
            document.fonts.load('100px Smartisan').then(() => {
                context.font = '900 100px sans-serif,Smartisan'
                context.fillStyle = '#4B5F64'
                context.fillText(`\ue900  ${exif.Model}`, fx, fy)
                canvas.toBlob((blob) => {
                    callback(URL.createObjectURL(blob))
                }, 'image/jpeg', 1.0)
            })
        }
        image.src = base64

    }
    let getEXIF = (file) => {
        return new Promise((resolve, reject) => {
            EXIF.getData(file, function() {
                resolve(EXIF.getAllTags(this))
            })
        })
    }
    let toastTip = (msg) => {
        uploadImg.value = ''
        M.toast({
            html: msg,
            displayLength: 3000,
            classes: 'rounded'
        })
    }
})(window)
