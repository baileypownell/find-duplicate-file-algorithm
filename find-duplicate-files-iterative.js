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
            // console.log(stack.length)  
            const currentNode = stack.pop() 
            if (currentNode) {   
                // console.log(stack.length)  
                const children = fs.readdirSync(currentNode.path)
                children.forEach(async(child, index) => {
                    // console.log('index = ', index, children.length)
                    const childPath = `${currentNode.path}/${child}`
                    const childNode = new TreeNode(childPath)
                    const endOfTreeSearch = index === children.length - 1 && stack.length === 0 
                    // console.log(endOfTreeSearch)
                    currentNode.children.push(childNode)
                    // ignoring node_modules because a number of file types therein throw errors ('no such file or directory') in Node
                    if (!childNode.path.includes('node_modules') && fs.statSync(childNode.path).isDirectory()) {
                        stack.push(childNode)
                    } else if (fs.statSync(childNode.path).isFile()) {
                        try {
                            const hash = await getHash(childNode.path)
                            hashedFileObj[hash] = (hashedFileObj[hash] || []).concat(childNode.path)
                            if (endOfTreeSearch) {
                                resolve(hashedFileObj)
                            }
                        } catch(e) {
                            console.log(e)
                        }
                    }
                })
            }
        }
    })

    // we know we've reached the end of the tree when the current child is equal to children.length - 1 && the stack size is back to 0 
    // how does this work for empty directories though, or directories without any child directories?
}

const getHash = (path) => {
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
    try {
        const hashedFiles = await getHashedFiles(directory)
        // console.log('hashedFiles = ', hashedFiles)
        const returnResult = []

        Object.keys(hashedFiles).forEach(hash => {
            // console.log(hash)
            if (hashedFiles[hash].length > 1) {
                const duplicateFiles = hashedFiles[hash]
                returnResult.push(duplicateFiles)
            }
        })
        console.log('returnResult: ', returnResult)
        console.log(`There are ${returnResult.length} instances of unique files that have been duplicated at least once in ${directory}.`)
    } catch(e) {
        console.log(e)
    }
} 

findDuplicateFiles().then(res => console.log(res))



// verifying that they are duplicates with stronger hashing algo