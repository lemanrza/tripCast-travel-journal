const {
    getAll,
    getOne,
    getByListId,
    create,
    update,
    delete: deleteJournal,
    toggleLike,
    searchJournalsService,
} = require("../services/journalService.js");
const formatMongoData = require("../utils/formatMongoData.js");

exports.searchJournalsController = async (req, res) => {
    try {
        const q = String(req.query.q || "");
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const userId = (req)?.user?._id || (req)?.user?.id;
        const filter = userId ? { $or: [{ author: userId }, { public: true }] } : { public: true };

        const result = await searchJournalsService({ q, page, limit, filter });
        res.json(result);
    } catch (err) {
        console.error("searchJournalsController error:", err);
        res.status(500).json({ message: "Search journals failed" });
    }
}

exports.getAllJournals = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const journals = await getAll(userId);

        res.status(200).json({
            message: "Journals retrieved successfully!",
            data: formatMongoData(journals),
        });
    } catch (error) {
        next(error);
    }
};

exports.getJournalById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const journal = await getOne(id, userId);

        res.status(200).json({
            message: "Journal retrieved successfully!",
            data: formatMongoData(journal),
        });
    } catch (error) {
        if (error.message === "Journal entry not found" ||
            error.message === "You don't have access to this journal entry" ||
            error.message === "Associated travel list not found") {
            res.status(404).json({
                message: error.message,
                data: null,
            });
        } else {
            next(error);
        }
    }
};

exports.getJournalsByListId = async (req, res, next) => {
    try {
        const { listId } = req.params;
        const userId = req.user._id;

        const journals = await getByListId(listId, userId);

        res.status(200).json({
            message: "Journals retrieved successfully!",
            data: formatMongoData(journals),
        });
    } catch (error) {
        if (error.message === "Travel list not found" ||
            error.message === "You don't have access to this travel list") {
            res.status(404).json({
                message: error.message,
                data: null,
            });
        } else {
            next(error);
        }
    }
};

exports.createJournal = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { title, content, photos, destination, public: isPublic, listId } = req.body;

        const journalData = {
            title,
            content,
            photos,
            destination,
            public: isPublic,
            listId,
        };

        console.log("Creating journal with data:", journalData);

        const response = await create(journalData, userId);

        if (!response.success) {
            return res.status(400).json({
                message: response.message,
                data: null,
            });
        }

        res.status(201).json({
            message: response.message,
            data: formatMongoData(response.data),
        });
    } catch (error) {
        next(error);
    }
};

exports.updateJournal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { title, content, photos, public: isPublic } = req.body;

        const updateData = {
            title,
            content,
            photos,
            public: isPublic,
        };

        const response = await update(id, updateData, userId);

        if (!response.success) {
            const statusCode = response.message === "Journal entry not found" ? 404 : 403;
            return res.status(statusCode).json({
                message: response.message,
                data: null,
            });
        }

        res.status(200).json({
            message: response.message,
            data: formatMongoData(response.data),
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteJournal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const response = await deleteJournal(id, userId);

        if (!response.success) {
            const statusCode = response.message === "Journal entry not found" ? 404 : 403;
            return res.status(statusCode).json({
                message: response.message,
                data: null,
            });
        }

        res.status(200).json({
            message: response.message,
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

exports.toggleJournalLike = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const response = await toggleLike(id, userId);

        if (!response.success) {
            const statusCode = response.message === "Journal entry not found" ? 404 : 400;
            return res.status(statusCode).json({
                message: response.message,
                data: null,
            });
        }

        res.status(200).json({
            message: response.message,
            data: response.data,
        });
    } catch (error) {
        next(error);
    }
};
