import mongoose from "mongoose";

const WeightSchema = mongoose.Schema({
    caravan: {
        type: String,
    },
    weight: {
        type: String
    },
    date: {
        type: Date
    }
}, {
    versionKey: false
});

const Weight = mongoose.model('Weight', WeightSchema);

export default Weight;