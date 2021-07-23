const fs = require("fs")
const path = require('path')
const md5File = require('md5-file')
// traverse the entire hard drive to find duplicates
// a duplicate is a file whose md5 hash is euqal to the hash of another md5 file 

// process
// 1) start to hash all files in a Map() where the md5 hash is the key and the array of image paths is the value
// 2) when a file is hashed, compare its hash to the Map
// 3) if a file's hash is already in the Map [duplicatefilename, originalfilename] into the array to return 

const directory = '/'

// cannot md5 hash these files due to not being able to open the files
const bannedExtensions = new Set(['.db', '.keytab', '.passwd', '.plist'])

console.log('------- THE CRAWLER HAS STARTED -------')

const crawl = (directory) => {
    fs.readdir(directory, (e, items) => {
        if (items) {
            items.forEach(item => {
                // console.log('item = ', item)
                let itemPath = path.join(directory, item)
                // console.log(itemPath)
                fs.stat(itemPath, (e, stats) => {
                    // checking for an extension prevent us from checking OS-specific files like .File
                    const absolutePath = path.resolve(itemPath)
                    const hasFileExtension = !!path.extname(absolutePath)
                    if (stats && stats.isDirectory()) {
                        crawl(itemPath)
                    } else if (stats && stats.isFile() && hasFileExtension && !bannedExtensions.has(path.extname(absolutePath))) {
                        console.log(`The ${item}, path = ${itemPath}, has a file extension`)
                        // hash it, compare, store, or return 
                        const hash = md5File.sync(`${itemPath}`)
                        console.log(`The MD5 sum of ${itemPath} is: ${hash}`)

                    }
                })
            })
        }
    })
}

crawl(directory)

// async function* walk(dir) {
//     for await (const d of await fs.promises.opendir(dir)) {
//         const entry = path.join(dir, d.name);
//         console.log(entry)
//         if (d.isDirectory()) yield* walk(entry);
//         else if (d.isFile()) yield entry;
//     }
// }

// // Then, use it with a simple async for loop
// async function main() {
//     for await (const p of walk(directory))
//         console.log(p)
// }

// main()