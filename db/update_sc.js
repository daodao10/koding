/*
* update stockcharts data
* sample:
* updateDate("20150708", "20150707");
* deleteByDate("20150717")
*/

var db = db.getSiblingDB("quotes");

function updateDate(d1, d2) {
	db.N52WH.update({d:d1}, {$set: {d:d2}}, {multi:true});
	db.N52WL.update({d:d1}, {$set: {d:d2}}, {multi:true});
	db.TTB.update({d:d1}, {$set: {d:d2}}, {multi:true});
	db.STTB.update({d:d1}, {$set: {d:d2}}, {multi:true});
	db.QTB.update({d:d1}, {$set: {d:d2}}, {multi:true});
	db.TBB.update({d:d1}, {$set: {d:d2}}, {multi:true});
	db.STBB.update({d:d1}, {$set: {d:d2}}, {multi:true});
	db.QBB.update({d:d1}, {$set: {d:d2}}, {multi:true});
}

function deleteByDate(d1) {
	db.N52WH.remove({d:d1});
	db.N52WL.remove({d:d1});
	db.TTB.remove({d:d1});
	db.STTB.remove({d:d1});
	db.QTB.remove({d:d1});
	db.TBB.remove({d:d1});
	db.STBB.remove({d:d1});
	db.QBB.remove({d:d1});
}
