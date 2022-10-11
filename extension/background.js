const fetchStorageConfig = () => {
    return new Promise((resolve) => {
        chrome.storage.local.get(['defaultDirectory', 'imageType'], 
            (result) => resolve(result))
    })
}

const getSuggestedFilename = async (url, type) => {
    try {
        const response = await fetch(url)
        const blob = await response.blob()
        if (!type) type = blob.type.replace(/.*\//, '')
        let filename = url.replace(/[?#].*/, '').replace(/.*[\/]/, '').replace(/\+/g, ' ')
            .replace(/[\x00-\x7f]+/g, (s) => s.replace(/[^\w\-\.\,@ ]+/g, ''))
        while (filename.match(/\.[^0-9a-z]*\./))
            filename = filename.replace(/\.[^0-9a-z]*\./g, '.')
        filename = filename.replace(/\s\s+/g, ' ').trim()
            .replace(/\.(jpe?g|png|gif|webp|svg)$/gi, '').trim()
            .replace(/[^0-9a-z]+$/i, '').trim()
        if (!filename) filename = new Date().getTime()
        return filename + '.' + type
    } catch (e) {
        return url.split('?')[0].split('/').pop()
            .replace(/\.png.*/, '.png').replace(/\.jpg.*/, '.jpg')
            .replace(/\.jpeg.*/, '.jpeg').replace(/\.bmp.*/, '.bmp')
            .replace(/\.gif.*/, '.gif').replace('\.webp.*', '.webp')
    }
}

const canvas = new OffscreenCanvas(0, 0)
const context = canvas.getContext('2d')
const getBase64 = async (width, height, url, type) => {
    try {
        const response = await fetch(url)
        const blob = await response.blob()
        const bitmap = await createImageBitmap(blob)
        console.log(bitmap)
        context.clearRect(0, 0, canvas.width, canvas.height)
        canvas.width = width
        canvas.height = height
        context.drawImage(bitmap, 0, 0, width, height)
        const newBlob = await canvas.convertToBlob({ 
            type: `image/${type}`
        })
        const reader = new FileReader()
        reader.readAsDataURL(newBlob)
        return new Promise((resolve) => {
            reader.onloadend = () => {
                resolve(reader.result)
            }
        })
    } catch (error) {
        console.error(error)
    }
}

const BASE_URL = 'http://127.0.0.1:6625/'
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request, sender)
    if (request.action === 'download') {
        const download = async () => {
            try {
                const { width, height, url } = request
                const config = await fetchStorageConfig()
                const defaultDirectory = config.defaultDirectory
                if (!defaultDirectory) {
                    sendResponse({ error: '请先设置下载文件夹' })
                    return
                }
                const imageType = config.imageType
                if (config.imageType) {
                    const filename = await getSuggestedFilename(url, imageType)
                    const base64 = await getBase64(width, height, url, imageType)
                    const base64Array = base64.split(',')
                    const fetchUrl = `${BASE_URL}download?defaultDirectory=${defaultDirectory}&filename=${filename}&url=${base64Array[0]}`
                    const response = await fetch(fetchUrl, {
                        method: 'POST',
                        body: base64Array.pop(),
                        duplex: 'half'
                    })
                    const json = await response.json()
                    console.log(json)
                    sendResponse(json)
                } else {
                    const filename = await getSuggestedFilename(request.url)
                    const fetchUrl = `${BASE_URL}download?defaultDirectory=${defaultDirectory}&filename=${filename}&url=${url}`
                    response = await fetch(fetchUrl, {
                        method: 'POST'
                    })
                    const json = await response.json()
                    console.log(json)
                    sendResponse(json)
                }
            } catch (error) {
                console.dir(error)
                sendResponse({ error: error.message })
            }
        }
        download()
    } else if (request.action === 'changeDefaultDirectory') {
        const changeDefaultDirectory = async () => {
            try {
                const response = await fetch(`${BASE_URL}changeDefaultDirectory`)
                const json = await response.json()
                console.log(json)
                sendResponse(json)
            } catch (error) {
                console.error(error)
                sendResponse({ error: error.message })
            }
        }
        changeDefaultDirectory()
    } else if (request.action === 'showDefaultDirectory') {
        const showDefaultDirectory = async () => {
            try {
                const config = await fetchStorageConfig()
                const defaultDirectory = config.defaultDirectory
                const response = await fetch(`${BASE_URL}showDefaultDirectory?defaultDirectory=${defaultDirectory}`)
                const json = await response.json()
                console.log(json)
                sendResponse(json)
            } catch (error) {
                console.error(error)
                sendResponse({ error: error.message })
            }
        }
        showDefaultDirectory()
    } else if (request.action === 'checkOnline') {
        const checkOnline = async () => {
            try {
                const response = await fetch(`${BASE_URL}checkOnline`)
                const json = await response.json()
                console.log(json)
                sendResponse(json)
            } catch (error) {
                console.error(error)
                sendResponse({ error: error.message })
            }
        }
        checkOnline()
    }
    return !!request.action
})

setInterval(async () => {
    try {
        const response = await fetch(`${BASE_URL}checkOnline`)
        await response.json()
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'checkOnline',
                    online: true
                }, (response) => {
                    console.log(response)
                })
            }
        })
    } catch (error) {
        console.error(error)
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'checkOnline',
                    online: false
                }, (response) => {
                    console.log(response)
                })
            }
        })
    }
}, 5000)
