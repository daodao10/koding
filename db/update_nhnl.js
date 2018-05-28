/*
* update new high - new low data
* sample:
* updateDate("20150708", "20150707");
* deleteByDate("20150717")
*/

var db = db.getSiblingDB("quotes");

function updateDate(d1, d2) {
	db.nhnl.update({d:d1}, {$set: {d:d2}}, {multi:true});
	db.nhnl_sum.update({_id:d1}, {$set: {_id:d2}}, {multi:true});
}

function deleteByDate(d1) {
	db.nhnl.remove({d:d1});
	db.nhnl_sum.remove({_id:d1});
}
