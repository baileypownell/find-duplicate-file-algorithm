const fs = require("fs");

// traverse the entire hard drive to find duplicates
// a duplicate is a file whose md5 hash is euqal to the hash of another md5 file 

// process
// 1) start to hash all files in a Map() where the md5 hash is the key and the array of image paths is the value
// 2) when a file is hashed, compare its hash to the Map
// 3) if a file's hash is already in the Map [duplicatefilename, originalfilename] into the array to return 



console.log('started!')