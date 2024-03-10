const generateUniqueId = (len) => {
    const str = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!*$@-_";
    let result = "";
    for (let i = 0; i < len; i++) {
        let randomIndex = Math.floor(Math.random() * str.length);
        result += str[randomIndex];
    }
    return result;
}

module.exports=generateUniqueId;