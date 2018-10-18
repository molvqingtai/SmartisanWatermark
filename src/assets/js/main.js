import M from 'materialize-css'
import tinycolor from 'tinycolor2'
import ColorThief from 'color-thief'
import loadImage from 'blueimp-load-image'
((window) => {
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
    let stamp = (() => {
        let blobUrl = null
        return (file) => {
            if (file) {
                if (/image\/\w+/.test(file.type)) {
                    ontrolState('start')
                    loadImage(file, (canvas, data) => {
                        let exif = data.exif
                        if (exif && exif.get('Make') && exif.get('Make').includes('Smartisan')) {
                            drawing(canvas, exif.get('Model')).then(
                                (res) => {
                                    let name = file.name.slice(0, file.name.lastIndexOf('.')) + '.jpeg'
                                    ontrolState('end', false, { url: res, name: name })
                                    blobUrl ? (URL.revokeObjectURL(blobUrl), blobUrl = res) : blobUrl = res
                                }, (rej) => {
                                    ontrolState('error', 'EXIF信息错误!')
                                })
                        } else {
                            ontrolState('error', '请上传Smartisan相机照片!')
                        }
                    }, {
                        orientation: true,
                        downsamplingRatio: 1.0,
                    })
                } else {
                    ontrolState('error', '照片格式错误!')
                }
            }
        }
    })()

    /**
     * [drawing 绘制水印]
     * @param  {[Object]}   exif     [图片EXIF]
     * @param  {[Object]}   sourceCanvas  [图片Canvas]
     * @param  {[String]}   watermark  [图片水印文字]
     * @return {[String]}            [图片Blob url]
     */
    let drawing = (sourceCanvas, watermark) => {
        let canvas = document.createElement('canvas')
        let pen = canvas.getContext('2d')
        let dx = 0
        let dy = 0
        let dw = sourceCanvas.width
        let dh = sourceCanvas.height
        let sx = sourceCanvas.width * 0.02
        let sy = sourceCanvas.width * 0.02
        let sw = sourceCanvas.width * 0.96
        let sh = sourceCanvas.height * 0.96
        let fx = sourceCanvas.width * 0.04
        let fy = sourceCanvas.height * 1.04
        canvas.width = sourceCanvas.width
        canvas.height = sourceCanvas.height + sourceCanvas.height * 0.1

        return new Promise((resolve, reject) => {
            document.fonts.load('100px Smartisan').then(() => {
                getColor(sourceCanvas).then((res) => {
                    pen.fillStyle = 'rgb(255,255,255)'
                    pen.fillRect(0, 0, canvas.width, canvas.height)
                    pen.drawImage(sourceCanvas, dx, dy, dw, dh, sx, sy, sw, sh)
                    pen.font = '700 100px sans-serif,Smartisan'
                    pen.fillStyle = res
                    pen.fillText(`\ue900  Shot on ${watermark}`, fx, fy)
                    canvas.toBlob((blob) => {
                        try {
                            resolve(URL.createObjectURL(blob))
                        } catch (error) {
                            reject(error)
                        }
                    }, 'image/jpeg', 1.0)
                })
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
     * @param  {[String]} msg [提示信息]
     * @param  {[Object]} attrs [图片属性]
     */
    let ontrolState = (state, msg = false, attrs) => {
        switch (state) {
            case 'start':
                (() => {
                    iconsBtn.firstElementChild.style.display = 'block'
                    iconsBtn.lastElementChild.style.display = 'none'
                    downloadBtn.innerHTML = '绘制水印中...'
                    downloadBtn.href = 'javascript::void(0);'
                })()
                break

            case 'end':
                (() => {
                    displayImg.src = downloadBtn.href = attrs.url
                    displayImg.onload = () => {
                        downloadBtn.download = attrs.name
                        iconsBtn.firstElementChild.style.display = 'none'
                        iconsBtn.lastElementChild.style.display = 'block'
                        downloadBtn.innerHTML = `保存水印照片<i class="material-icons">file_download</i>`
                        downloadBtn.removeAttribute('disabled')
                    }
                })()
                break

            case 'error':
                (() => {
                    iconsBtn.firstElementChild.style.display = 'none'
                    iconsBtn.lastElementChild.style.display = 'block'
                    downloadBtn.innerHTML = `保存水印照片<i class="material-icons">file_download</i>`
                    downloadBtn.setAttribute('disabled', 'disabled')
                })()
                break
        }
        if (msg) {
            M.toast({
                html: msg,
                displayLength: 3000,
                classes: 'rounded'
            })
        }
        uploadImg.value = ''
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
