import mongoose from "mongoose";

const manualWeighingSchema = mongoose.Schema({
    caravan: {
        type: String,
        required: true
    },
    weight: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    }
}, {
    versionKey: false
});

const ManualWeighing = mongoose.model('ManualWeighing', manualWeighingSchema);

export default ManualWeighing;