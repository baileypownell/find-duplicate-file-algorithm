const fs = require("fs")
const path = require('path')
var crypto = require('crypto');
// traverse a directory ( a general tree ) to find duplicates
// a duplicate is a file whose hash is equal to the hash of another file 
const directory = '/Users/baileypownell/Desktop/duplicates'

console.log('------- THE CRAWLER HAS STARTED -------')

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

// SYNCHRONOUS APPROACH
// // using depth-first search with a stack
// const getHashedFiles = (directory) => {
//     const hashedFileObj = {}
//     const root = new TreeNode(directory)
//     // TreeNode { path: '/Users/baileypownell/Desktop', children: [] }
//     const stack = [root]
//     // [ TreeNode { path: '/Users/baileypownell/Desktop', children: [] } ]
//     while (stack.length) {
//         const currentNode = stack.pop() 
//         if (currentNode) {     
//             const children = fs.readdirSync(currentNode.path)

//             for (let child of children) {
//                 const childPath = `${currentNode.path}/${child}`
//                 const childNode = new TreeNode(childPath)

//                 currentNode.children.push(childNode)
//                 // ignoring node_modules because a number of file types therein throw errors ('no such file or directory') in Node
//                 if (!childNode.path.includes('node_modules') && fs.statSync(childNode.path, { throwIfNoEntry: false }).isDirectory()) {
//                     stack.push(childNode)
//                 } else if (fs.statSync(childNode.path).isFile()) {
//                     // TO-DO: only hash part of the file
//                     const hash = md5File.sync(`${childNode.path}`)                   
//                     hashedFileObj[hash] = (hashedFileObj[hash] || []).concat(childNode.path)
//                 }
//             }
//         }
//     }

//     return hashedFileObj
// }

// ASYNCHRONOUS APPROACH
const getHashedFiles = async (directory) => {
    return new Promise(async(resolve, reject) => {
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
                    if (!childNode.path.includes('node_modules') && fs.statSync(childNode.path).isDirectory()) {
                        stack.push(childNode)
                    } else if (fs.statSync(childNode.path).isFile()) {
                        try {
                            const hash = await getHash(childNode.path, hashedFileObj)
                            hashedFileObj[hash] = (hashedFileObj[hash] || []).concat(childNode.path)
                        } catch(e) {
                            console.log(e)
                        }
                    }
                }
            }
        }
    })
}

const getHash = (path, hashedFileObj) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5')
         // only reading half the file 
         const endByteSize = Math.round(fs.statSync(path).size / 2) // statSynce.size is already in bytes
         const partialFileRead = fs.createReadStream(path, { start: 0, end: endByteSize })
         partialFileRead
         .on('data', async(chunk) => hash.update(chunk))
         .on('end', () => resolve(hash.digest('hex')))
    })
}

const findDuplicateFiles = async() => {
    console.log('findDuplicateFiles()')
    try {
        const hashedFiles = await getHashedFiles(directory)
        console.log('hashedFiles = ', hashedFiles)
        const returnResult = []

        Object.keys(hashedFiles).forEach(hash => {
            console.log(hash)
            if (hashedFiles[hash].length > 1) {
                const duplicateFiles = hashedFiles[hash]
                returnResult.push(duplicateFiles)
            }
        })
        console.log(returnResult)
        console.log(`There are ${returnResult.length} instances of unique files that have been duplicated at least once in ${directory}.`)
    } catch(e) {
        console.log(e)
    }
} 

findDuplicateFiles().then(res => console.log(res))



// verifying that they are duplicates with stronger hashing algo