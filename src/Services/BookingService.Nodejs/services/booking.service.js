"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const booking_1 = require("../models/booking");
const parking_slot_1 = require("../models/parking-slot");
const data_source_1 = require("../data/data-source");
class BookingService {
    constructor() {
        this._maximumAllowedBookingPeriod = 12 * 60 * 60 * 1000;
        this._bookingRepository = data_source_1.AppDataSource
            .getRepository(booking_1.Booking);
        this._parkingSlotRepository = data_source_1.AppDataSource.getRepository(parking_slot_1.ParkingSlot);
    }
    getUserBookings(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let bookings = this._bookingRepository.findBy({
                userId: userId
            });
            return bookings;
        });
    }
    bookParkingSlot(userId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            if (startDate.getTime() + 60 * 60 * 1000 > endDate.getTime()
                || endDate.getTime() - startDate.getTime() > this._maximumAllowedBookingPeriod) {
                throw new Error("Invalid start or end date of requested booking");
            }
            let parkingSlots = yield this._parkingSlotRepository.find();
            let bookingsForGivenTimePeriod = yield data_source_1.AppDataSource
                .getRepository(booking_1.Booking)
                .createQueryBuilder("booking")
                .where("booking.startDate > :startDate AND booking.endDate > :endDate", { startDate: startDate, endDate: endDate })
                .orWhere("booking.startDate > :startDate AND booking.endDate < :endDate", { startDate: startDate, endDate: endDate })
                .orWhere("booking.startDate < :startDate AND booking.endDate > :endDate", { startDate: startDate, endDate: endDate })
                .orWhere("booking.startDate < :startDate AND booking.endDate < :endDate", { startDate: startDate, endDate: endDate })
                .getMany();
            let currentlyBookedParkingSlots = bookingsForGivenTimePeriod.map(booking => booking.parkingSlotId).filter(this.uniqueFilter);
            let freeSlots = parkingSlots.filter(parkingSlot => !currentlyBookedParkingSlots.includes(parkingSlot.id));
            if (!freeSlots.length) {
                throw new Error("No free parking spots found");
            }
            let booking = new booking_1.Booking();
            booking.parkingSlotId = freeSlots[0].id;
            booking.userId = userId;
            booking.startDate = startDate;
            booking.endDate = endDate;
            yield this._bookingRepository.save(booking);
        });
    }
    cancelBooking(bookingId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._bookingRepository.delete({ id: bookingId });
        });
    }
    uniqueFilter(value, index, self) {
        return self.indexOf(value) === index;
    }
}
exports.BookingService = BookingService;
//# sourceMappingURL=booking.service.js.map