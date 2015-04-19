function object(o) {　　　　
    function F() {}　　　　
    F.prototype = o;　　　　
    return new F();　　
}


var Chinese = {　　　　
    nation: '中国'　　
};

// var Doctor = {　　　　
//     career: '医生'　　
// };
//make Doctor inherit Chinese
var Doctor = object(Chinese);
Doctor.career = '医生';


console.log(Doctor);
console.log(Doctor.nation);

// var doc = new Doctor();
// console.log(doc);