const Group = require("../models/groupModel");

const toStr = (id) => (typeof id === "string" ? id : id?.toString());

/** GET all groups (newest first) */
async function getAll() {
    return Group.find().sort({ createdAt: -1 });
}

/** GET one group by id */
async function getById(id) {
    return Group.findById(id);
}

async function update(id, data) {
    const group = await Group.findById(id);
    if (!group) return null;

    const updates = {};
    if (typeof data.name === "string") updates.name = data.name;
    if (typeof data.description === "string") updates.description = data.description;

    if (data.profileImage !== undefined) {
        const img = data.profileImage;
        updates.profileImage =
            typeof img === "string"
                ? { url: img }
                : {
                    url: img?.url ?? group.profileImage?.url,
                    public_id: img?.public_id ?? group.profileImage?.public_id ?? "",
                };
    }

    Object.assign(group, updates);
    await group.save();
    return group;
}


module.exports = { getAll, getById, update };
