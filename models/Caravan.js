import mongoose from "mongoose";

const CaravanSchema = mongoose.Schema({
    caravan: {
        type: String,
    }
}, {
    versionKey: false
});

const Caravan = mongoose.model('Caravan', CaravanSchema);

export default Caravan;