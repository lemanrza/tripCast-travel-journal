const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildRegexQuery = (q, fields) => {
    if (!q) return {};
    const rx = new RegExp(escapeRx(q), "i");
    return { $or: fields.map((f) => ({ [f]: rx })) };
};
module.exports ={
    buildRegexQuery
};