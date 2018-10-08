(() => {
    let displayImg = document.querySelector('#display-img')
    let uploadImg = document.querySelector('#upload-img')
    let downloadBtn = document.querySelector('#download-btn')
    let iconsBtn = document.querySelector('#icons-btn')
    uploadImg.addEventListener('change', (e) => {
        stamp(e.target.files[0])
    })
    displayImg.addEventListener('click', (e) => {
        e.preventDefault()
        fullscreen(e.currentTarget)
    })
    displayImg.addEventListener('touch', (e) => {
        e.preventDefault()
        fullscreen(e.currentTarget)
    })

    /**
     * [stamp 水印戳]
     * @param  {[Object]} file [图片数据]
     */
    let stamp = (file) => {
        if (file) {
            if (/image\/\w+/.test(file.type)) {
                getEXIF(file).then((res) => {
                    if (Object.keys(res).length > 0 && res.Make.includes('Smartisan')) {
                        let reader = new FileReader()
                        reader.onload = (e) => {
                            ontrolState('start')
                            drawing(res, e.target.result).then((res) => {
                                let name = file.name.slice(0, file.name.lastIndexOf('.')) + '.jpeg'
                                ontrolState('end', { url: res, name: name })
                            }, (rej) => {
                                toastTip('照片EXIF信息错误!')
                                ontrolState('error')
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

    /**
     * [drawing 绘制水印]
     * @param  {[Object]}   exif     [图片EXIF]
     * @param  {[String]}   base64   [图片Base64]
     * @return {[String]}            [图片Blob url]
     */
    let drawing = (exif, base64) => {


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

        return new Promise((resolve, reject) => {
            image.onload = () => {
                document.fonts.load('100px Smartisan').then(() => {
                    getColor(image).then((res) => {
                        context.fillStyle = '#FFFFFF'
                        context.fillRect(0, 0, canvas.width, canvas.height)
                        context.drawImage(image, dx, dy, dw, dh, sx, sy, sw, sh)
                        context.font = '700 100px sans-serif,Smartisan'
                        context.fillStyle = res
                        context.fillText(`\ue900  Shot on ${exif.Model}`, fx, fy)
                        canvas.toBlob((blob) => {
                            try {
                                resolve(URL.createObjectURL(blob))
                            } catch (error) {
                                reject(error)
                            }
                        }, 'image/jpeg', 1.0)
                    })
                })
            }
            //可以直接用URL.createObjectURL(file),但是会多创建一个url对象
            image.src = base64
        })
    }

    /**
     * [getEXIF 获取EXIF]
     * @param  {[Object]} file [图片数据]
     * @return {[Object]}      [EXIF对象]
     */
    let getEXIF = (file) => {
        return new Promise((resolve, reject) => {
            EXIF.getData(file, function() {
                resolve(EXIF.getAllTags(this))
            })
        })
    }

    /**
     * [getColor 获取主色]
     * @param  {[Object]} image [图片对象]
     * @return {[String]}       [图片主色]
     */
    let getColor = (image) => {
        return new Promise((resolve, reject) => {
            let colorThief = new ColorThief()
            let colorArray = colorThief.getPalette(image, 10)
            colorArray.unshift(colorThief.getColor(image))
            colorArray.forEach((c) => {
                let color = `rgb(${c[0]},${c[1]},${c[2]})`
                tinycolor(color).isDark() ? resolve(color) : resolve('rgb(102, 102, 102)')
            })
        })
    }

    /**
     * [ontrolState 状态控制]
     * @param  {[String]} state [状态信息]
     * @param  {[Object]} image [图片信息]
     */
    let ontrolState = (state, image) => {
        switch (state) {
            case 'start':
                (() => {
                    iconsBtn.firstElementChild.style.display = 'block'
                    iconsBtn.lastElementChild.style.display = 'none'
                    downloadBtn.innerHTML = '生成水印中...'
                    downloadBtn.href = 'javascript::void(0);'
                })()
                break

            case 'end':
                (() => {
                    displayImg.src = downloadBtn.href = image.url
                    displayImg.onload = () => {
                        downloadBtn.download = image.name
                        iconsBtn.firstElementChild.style.display = 'none'
                        iconsBtn.lastElementChild.style.display = 'block'
                        downloadBtn.innerHTML = `下载水印照片<i class="material-icons">file_download</i>`
                        downloadBtn.removeAttribute('disabled')
                    }
                })()
                break

            case 'error':
                (() => {
                    iconsBtn.firstElementChild.style.display = 'none'
                    iconsBtn.lastElementChild.style.display = 'block'
                    downloadBtn.innerHTML = `下载水印照片<i class="material-icons">file_download</i>`
                    downloadBtn.setAttribute('disabled', 'disabled')
                })()
                break
        }
    }

    /**
     * [toastTip 弹窗提示]
     * @param  {[String]} msg [提示信息]
     */
    let toastTip = (msg) => {
        uploadImg.value = ''
        M.toast({
            html: msg,
            displayLength: 3000,
            classes: 'rounded'
        })
    }

    /**
     * [fullscreen 全屏控制]
     * @param  {[Object]} e [全屏对象]
     */
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
