const fetchStorageConfig = () => {
    return new Promise((resolve) => {
        chrome.storage.local.get('defaultDirectory', (result) => {
            console.log(result)
            if (result && result.defaultDirectory) {
                resolve(result.defaultDirectory)
            } else {
                resolve('~\\Downloads')
            }
        })
    })
}

const getSuggestedFilename = async (url) => {
    try {
        const response = await fetch(url)
        const blob = await response.blob()
        const type = blob.type.replace(/.*\//, '')
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request, sender)
    if (request.action === 'download') {
        console.log('456', request.base64)
        const download = async () => {
            try {
                const defaultDirectory = await fetchStorageConfig()
                const filename = await getSuggestedFilename(request.url)
                const response = await fetch(`http://127.0.0.1:8080/download?defaultDirectory=${defaultDirectory}&filename=${filename}&url=${request.url}`)
                const json = await response.json()
                console.log(json)
                sendResponse(json)
            } catch (error) {
                console.dir(error)
                sendResponse({ error: error.message })
            }
        }
        download()
    } else if (request.action === 'changeDefaultDirectory') {
        const changeDefaultDirectory = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8080/changeDefaultDirectory')
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
            try{
                const defaultDirectory = await fetchStorageConfig()
                const response = await fetch('http://127.0.0.1:8080/showDefaultDirectory?defaultDirectory=' + defaultDirectory)
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
                const response = await fetch('http://127.0.0.1:8080/checkOnline')
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
        const response = await fetch('http://127.0.0.1:8080/checkOnline')
        const json = await response.json()
        console.log(json)
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
