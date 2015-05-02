/*
* update stockcharts data
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

// updateDate("20150501", "20150430");
