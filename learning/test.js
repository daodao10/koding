// 错误的写法
//// var v;
// if (v){
//     // ...
// }
// ReferenceError: v is not defined

// 正确的写法
if (typeof v === "undefined"){
    // ...
}


//undefined表示"缺少值"，就是此处应该有一个值，但是还未定义。
// 典型用法是：
// 变量被声明了，但没有赋值时，就等于undefined。
// 调用函数时，应该提供的参数没有提供，该参数等于undefined。
// 对象没有赋值的属性，该属性的值为undefined。
// 函数没有返回值时，默认返回undefined。

if (!undefined) 
    console.log('undefined is false');
// undefined is false

//null表示"没有对象"，即该处不应该有值。
// 典型用法是：
// 作为函数的参数，表示该函数的参数不是对象。
// 作为对象原型链的终点。
if (!null) 
    console.log('null is false');

// this doesn't say null is an object
// null & undefined are special value for javascript
console.log(typeof null); // "object"

// 既然typeof对数组（array）和对象（object）的显示结果都是object，那么怎么区分它们呢？instanceof运算符可以做到。
var o = {};
var a = [];

console.log(typeof o);
console.log(typeof a);

console.log(o instanceof Array); // false
console.log(a instanceof Array); // true

// the followings are false, except these are true
// undefined
// null
// false
// 0
// NaN
// ""

// 特别注意的是，空数组（[]）和空对象（{}）对应的布尔值，都是true
if ([]){ console.log(true);}
if ({}){ console.log(true);}