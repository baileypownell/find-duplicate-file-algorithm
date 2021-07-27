const fs = require("fs")
const directory = '/Users/baileypownell/Desktop'

console.log('------- THE CRAWLER HAS STARTED -------')

// SYNCHRONOUS APPROACH
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