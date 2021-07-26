
const fs = require("fs")
const path = require('path')
const md5File = require('md5-file')
// traverse a directory ( a general tree ) to find duplicates
// a duplicate is a file whose hash is equal to the hash of another file 

const directory = '/Users/baileypownell/Desktop'

console.log('------- THE CRAWLER HAS STARTED -------')

// uses recursion; undersirable
const crawl = (directory) => {
    fs.readdir(directory, (e, items) => {
        if (items) {
            items.forEach(item => {
                let itemPath = path.join(directory, item)
                fs.stat(itemPath, (e, stats) => {
                    // checking for an extension prevent us from checking OS-specific files like .File
                    if (stats && stats.isDirectory()) {
                        crawl(itemPath)
                    } else if (stats && stats.isFile()) {
                        md5File.sync(`${itemPath}`)
                    }
                })
            })
        }
    })
}

crawl(directory)