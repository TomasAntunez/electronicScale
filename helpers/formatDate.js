
const formatDate = date => {
    let formatedDate = date.getDate() + "/" + (date.getMonth() + 1);
    return formatedDate;
};

export default formatDate;