const checkForHexRegExpFunction = (id) => {
    return new RegExp("^[0-9a-fA-F]{24}$").test(id);
};
module.exports = checkForHexRegExpFunction;