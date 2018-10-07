(() => {
    let displayImg = document.querySelector('#display-img')
    let uploadImg = document.querySelector('#upload-img')
    let downloadBtn = document.querySelector('#download-btn')
    let iconsBtn = document.querySelector('#icons-btn')
    uploadImg.addEventListener('change', (e) => {
        upload(e.target.files[0])
    })
    displayImg.addEventListener('click', (e) => {
        e.preventDefault()
        console.log(e.currentTarget);
        fullscreen(e.currentTarget)
    })
    displayImg.addEventListener('touch', (e) => {
        e.preventDefault()
        fullscreen(e.currentTarget)
    })
    let upload = (file) => {
        if (file) {
            if (/image\/\w+/.test(file.type)) {
                getEXIF(file).then((res) => {
                    if (Object.keys(res).length > 0 && res.Make.includes('Smartisan')) {
                        let reader = new FileReader()
                        reader.onload = (e) => {
                            iconsBtn.firstElementChild.style.display = 'block'
                            iconsBtn.lastElementChild.style.display = 'none'
                            downloadBtn.innerHTML = '生成水印中...'
                            downloadBtn.href = 'javascript::void(0);'
                            drawing(res, e.target.result).then((res) => {
                                if (res) {
                                    displayImg.src = downloadBtn.href = res
                                    displayImg.onload = () => {
                                        downloadBtn.download = file.name.slice(0, file.name.lastIndexOf('.')) + '.jpeg'
                                        iconsBtn.firstElementChild.style.display = 'none'
                                        iconsBtn.lastElementChild.style.display = 'block'
                                        downloadBtn.innerHTML = `下载水印照片<i class="material-icons">file_download</i>`
                                        downloadBtn.removeAttribute('disabled')
                                    }
                                } else {
                                    iconsBtn.firstElementChild.style.display = 'none'
                                    iconsBtn.lastElementChild.style.display = 'block'
                                    downloadBtn.innerHTML = `下载水印照片<i class="material-icons">file_download</i>`
                                    downloadBtn.setAttribute('disabled', 'disabled')
                                    toastTip('照片EXIF信息错误!')
                                }
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

        return new Promise((resolve, reject) => {
            let canvas = document.createElement('canvas')
            let context = canvas.getContext('2d')
            let image = new Image()
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

                document.fonts.load('100px Smartisan').then(() => {
                    getColor(image).then((res) => {
                        context.font = '700 100px sans-serif,Smartisan'
                        context.fillStyle = res
                        context.fillText(`\ue900  Shot on ${exif.Model}`, fx, fy)
                        canvas.toBlob((blob) => {
                            try {
                                resolve(URL.createObjectURL(blob))
                            } catch (e) {
                                resolve(false)
                            }
                        }, 'image/jpeg', 1.0)
                    })
                })
            }
            image.src = base64
        })
    }
    let getEXIF = (file) => {
        return new Promise((resolve, reject) => {
            EXIF.getData(file, function() {
                resolve(EXIF.getAllTags(this))
            })
        })
    }
    let getColor = (image) => {
        return new Promise((resolve, reject) => {
            let colorThief = new ColorThief();
            let colorArray = colorThief.getPalette(image, 10)
            colorArray.unshift(colorThief.getColor(image))
            colorArray.forEach((c) => {
                let color = `rgb(${c[0]},${c[1]},${c[2]})`
                tinycolor(color).isDark() ? resolve(color) : resolve('rgb(102, 102, 102)')
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

    let fullscreen = (e) => {
        let requestFullscreen = () => {
            if (e.requestFullscreen) {
                e.requestFullscreen()
            } else if (e.webkitRequestFullScreen) {
                if (window.navigator.userAgent.toUpperCase().indexOf('CHROME') >= 0) {
                    e.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)
                } else {
                    e.webkitRequestFullScreen()
                }
            } else if (e.mozRequestFullScreen) {
                e.mozRequestFullScreen()
            }
        }
        let exitFullscreen = () => {
            if (document.exitFullscreen) {
                document.exitFullscreen()
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen()
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen()
            }
        }
        let isFullscreen = () => {
            return document.fullscreen || document.webkitIsFullScreen || document.mozFullScreen || false
        }

        isFullscreen() ? exitFullscreen() : requestFullscreen()

    }
})(window)
