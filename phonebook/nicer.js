function nicer(req, res, next) {
    res.renderPrepend = function(pre, tmpl, vars) {
        if (pre && typeof pre === 'object') {
            var script = '<script type="text/javascript">'
            for (var k in pre) {
                script += k + '=' + (pre[k] === null ? 'null' : pre[k])  + ';';
            }
            pre = script + '</script>';
        }
        res.render(tmpl, vars, function(err, o) {
            if (err) console.error(err);
            res.send(pre + o);
        });
    }
    
    res.bundled = function(model, pre, tmpl, vars) {
        model.bundle(function(bundle) {
            if (pre == null) {
                pre = { init: bundle };
            } else if (typeof pre === 'object') {
                pre.init = bundle;
            } else {
                pre += '<script type="text/javascript">init=' + bundle + '</script>';
            }
            res.renderPrepend(pre, tmpl, vars);
        });
    }

    next();
}

module.exports = nicer;
