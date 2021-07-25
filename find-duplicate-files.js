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
                console.log('item = ', item)
                let itemPath = path.join(directory, item)
                // console.log(itemPath)
                fs.stat(itemPath, (e, stats) => {
                    // checking for an extension prevent us from checking OS-specific files like .File
                    const absolutePath = path.resolve(itemPath)
                    // const hasFileExtension = !!path.extname(absolutePath)
                    if (stats && stats.isDirectory()) {
                        crawl(itemPath)
                    } else if (stats && stats.isFile()) {
                        // console.log(`The ${item}, path = ${itemPath}, has a file extension`)
                        // hash it, compare, store, or return 
                        const hash = 'unknown' //md5File.sync(`${itemPath}`)
                        console.log(`The MD5 sum of ${itemPath} is: ${hash}`)

                    }
                })
            })
        }
    })
}

// crawl(directory)

// to avoid recursion, use a stack to record the fallback route
// which strategy is more appropriate: preorder or postorder? 
// (inorder is not useful for general trees, only binary)
class TreeNode {
    path 
    children 

    constructor(path) {
        this.path = path 
        this.children = []
    }
}

// using depth-first search with a stack
const getHashedFiles = (directory) => {
    const hashedFileObj = {}
    const root = new TreeNode(directory)
    // TreeNode { path: '/Users/baileypownell/Desktop', children: [] }
    const stack = [root]
    // [ TreeNode { path: '/Users/baileypownell/Desktop', children: [] } ]
    while (stack.length) {
        const currentNode = stack.pop() 
        if (currentNode) {     
            const children = fs.readdirSync(currentNode.path)

            for (let child of children) {
                const childPath = `${currentNode.path}/${child}`
                const childNode = new TreeNode(childPath)

                currentNode.children.push(childNode)
                // ignoring node_modules because a number of file types therein throw errors ('no such file or directory') in Node
                if (!childNode.path.includes('node_modules') && fs.statSync(childNode.path, { throwIfNoEntry: false }).isDirectory()) {
                    stack.push(childNode)
                } else if (fs.statSync(childNode.path).isFile()) {
                    // TO-DO: only hash part of the file
                    const hash = md5File.sync(`${childNode.path}`)                   
                    hashedFileObj[hash] = (hashedFileObj[hash] || []).concat(childNode.path)
                }
            }
        }
    }

    return hashedFileObj
}

const hashedFiles = getHashedFiles(directory)

const returnResult = []

Object.keys(hashedFiles).forEach(hash => {
    if (hashedFiles[hash].length > 1) {
        const duplicateFiles = hashedFiles[hash]
        returnResult.push(duplicateFiles)
    }
})
// console.log(returnResult)
// console.log(returnResult.length)

console.log(`There are ${returnResult.length} instances of unique files that have been duplicated at least once in ${directory}.`)