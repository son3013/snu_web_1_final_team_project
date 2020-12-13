const mongoose = require("mongoose");
const Schema = mongoose.Schema;
    
const PlayerItem = mongoose.model("PlayerItem", {
    user: { type: Schema.Types.ObjectId, ref: 'Player' },
    itemId: Number,
});

module.exports = {
    PlayerItem,
};
