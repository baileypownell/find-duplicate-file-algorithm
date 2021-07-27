const fs = require('fs')
var crypto = require('crypto')
// traverse a directory ( a general tree ) to find duplicates
// a duplicate is a file whose hash is equal to the hash of another file 
const directory = '/Users/baileypownell/Desktop'

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

// ASYNCHRONOUS APPROACH
const getHashedFiles = async (directory) => {
    return new Promise(async(resolve, reject) => {
        if (!fs.existsSync(directory)) {
            reject('Provided path is invalid.')
        }
        const hashedFileObj = {}
        const root = new TreeNode(directory)
        // TreeNode { path: '/Users/baileypownell/Desktop', children: [] }
        const stack = [root]
        // [ TreeNode { path: '/Users/baileypownell/Desktop', children: [] } ] 
        while (stack.length) {       
            const currentNode = stack.pop() 
            if (currentNode) {   
                try {
                    const children = fs.readdirSync(currentNode.path).filter(file => !file.includes('.DS_Store'))
                    if (!children.length && !stack.length) {
                        // directory is completely empty
                        resolve([])
                    }
                    let index = 0
                    for (let child of children) {
                        const childPath = `${currentNode.path}/${child}`
                        const childNode = new TreeNode(childPath)
                        
                        currentNode.children.push(childNode)
                        const endOfTreeSearch = index === children.length - 1 && stack.length === 0 
                        // ignoring node_modules because a number of file types therein throw errors ('no such file or directory') in Node
                        if (!childNode.path.includes('node_modules') && fs.statSync(childNode.path).isDirectory()) {
                            stack.push(childNode)
                        } else if (fs.statSync(childNode.path).isFile()) {
                            try {
                                const hash = await generateHash(childNode.path)
                                hashedFileObj[hash] = (hashedFileObj[hash] || []).concat(childNode.path)
                                if (endOfTreeSearch) {
                                    resolve(hashedFileObj)
                                }
                            } catch(e) {
                                console.log('Error: ', e)
                            }
                        }
                        index++
                    }
                } catch(e) {
                    if (e.code === 'ENOENT') {
                        resolve('No such file or directory.')
                    }
                    reject(e)
                }
            }
        }
    })
}

const generateHash = (path) => {
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

getHashedFiles(directory)
.then(hashedFiles => {
    const returnResult = []
    Object.keys(hashedFiles).forEach(hash => {
        if (hashedFiles[hash].length > 1) {
            const duplicateFiles = hashedFiles[hash]
            returnResult.push(duplicateFiles)
        }
    })
    console.log('Duplicate files: ', returnResult)
    console.log(`${returnResult.length} unique file(s) have been duplicated at least once in ${directory}.`)
})
.catch(err => console.log('THERE WAS AN ERROR: ', err))
