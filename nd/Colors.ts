export class Colors {
    static Style = {
        "Reset": "\u001b[0m",
        "Bright": "\u001b[1m",
        "Dim": "\u001b[2m",
        "Underscore": "\u001b[4m",
        "Blink": "\u001b[5m",
        "Reverse": "\u001b[7m",
        "Hidden": "\u001b[8m",
        "FG": {
            "Black": "\u001b[30m",
            "Red": "\u001b[31m",
            "Green": "\u001b[32m",
            "Yellow": "\u001b[33m",
            "Blue": "\u001b[34m",
            "Magenta": "\u001b[35m",
            "Cyan": "\u001b[36m",
            "White": "\u001b[37m"
        },
        "BG": {
            "Black": "\u001b[40m",
            "Red": "\u001b[41m",
            "Green": "\u001b[42m",
            "Yellow": "\u001b[43m",
            "Blue": "\u001b[44m",
            "Magenta": "\u001b[45m",
            "Cyan": "\u001b[46m",
            "White": "\u001b[47m"
        }
    };
    constructor(){}
    private inner(func, color, args):void{
        var length = args.length;
        if(length == 1) {
            func(color, args[0], Colors.Style.Reset);
        } else if(length == 2){
            func(color, args[0], args[1], Colors.Style.Reset);
        } else if(length == 3){
            func(color, args[0], args[1], args[2], Colors.Style.Reset);
        }else if (length == 4){
            func(color, args[0], args[1], args[2], args[3], Colors.Style.Reset);
        }else{
            func(color, args, Colors.Style.Reset);
        }
    }
    red(...args): void{
        this.inner(console.log, Colors.Style.FG.Red, args);
    }
    green(...args): void{
        this.inner(console.log, Colors.Style.FG.Green, args);
    }
    yellow(...args): void{
        this.inner(console.log, Colors.Style.FG.Yellow, args);
    }
    blue(...args): void{
        this.inner(console.log, Colors.Style.FG.Blue, args);
    }
}
