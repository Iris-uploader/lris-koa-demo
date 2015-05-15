var logger = require('koa-logger');
var serve = require('koa-static');
var parse = require('co-busboy');
var koa = require('koa');
var fs = require('fs');
var coFs = require('co-fs-extra');
var app = koa();
var path = require('path');

// log requests

app.use(logger());

app.use(serve(__dirname + '/public'));
app.use(serve(__dirname + '/temp'));

app.use(function *(next){
    var self = this;
    var url = this.path;
    var method = this.method;
    if(url === '/upload' && method === 'POST'){

        //每次上传都先清空目录
        yield coFs.remove('./temp');
        yield coFs.mkdirs('./temp');

        var parts = parse(this);
        var part;
        while (part = yield parts) {
            var mime = part.mime;
            if(!mime) continue;
            //必须是图片
            if(!/^image\/(\w+)/.test(mime)){
                this.body = '{"status":0,message:"只允许上传图片"}';
                return false;
            }
            var time = new Date().valueOf();
            var newFileName = time+'.'+RegExp.$1;
            var target = path.resolve('./temp/'+newFileName);

            var stream = fs.createWriteStream(target);
            part.pipe(stream);
            console.log('uploading %s -> %s', part.filename, stream.path);
            part.on('end',function(){
                self.body = '{"status":1,"type":"ajax","name":"'+part.filename+'","url":"http://'+self.host+'/'+newFileName+'"}';
            })
        }
    }
});

// listen

app.listen(4444);
console.log('listening on port 4444');