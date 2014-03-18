/*
Copyright (c) 2008-2011, anekos.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

    1. Redistributions of source code must retain the above copyright notice,
       this list of conditions and the following disclaimer.
    2. Redistributions in binary form must reproduce the above copyright notice,
       this list of conditions and the following disclaimer in the documentation
       and/or other materials provided with the distribution.
    3. The names of the authors may not be used to endorse or promote products
       derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
THE POSSIBILITY OF SUCH DAMAGE.


###################################################################################
# http://sourceforge.jp/projects/opensource/wiki/licenses%2Fnew_BSD_license       #
# に参考になる日本語訳がありますが、有効なのは上記英文となります。                #
###################################################################################

*/

var INFO = xml `
<plugin name="Maine Conn" version="2.6.7"
    href="https://github.com/vimpr/vimperator-plugins/raw/master/maine_coon.js"
    summary = "hide the bottom statusbar"
    xmlns="http://vimperator.org/namespaces/liberator">
    <author href="http://d.hatena.ne.jp/nokturnalmortum/">anekos</author>
    <license>BSD</license>
    <project name="Vimperator" minVersion="3.7.1"/>
    <p>
    <code><![CDATA[
    == Requires ==
        _libly.js

    == Options ==
        mainecoon:
          Possible values
            c:
              Hide caption-bar
            a:
              Hide automatically command-line
            C:
              Hide caption-bar
              If window is maximized, then window maximize after window is hid.

          >||
            :set mainecoon=ac
          ||<

          The default value of this option is "a".

        === note ===
            The C and c options probably are supported on some OSs only.

    == Global Variables ==
        maine_coon_targets:
            Other elements IDs that you want to hide.
            let g:maine_coon_targets = "sidebar-2 sidebar-2-splitter"

        maine_coon_default:
            The default value of 'mainecoon' option.
            >||
                let g:maine_coon_default = "ac"
            ||<

        maine_coon_style:
            The Style for message output.
            >||
            let g:maine_coon_style = "border: 1px solid pink; padding: 3px; color: pink; background: black; font: 18px/1 sans-serif;"
            ||<

    == Thanks ==
        * snaka72 (hidechrome part):
          http://vimperator.g.hatena.ne.jp/snaka72/20090106/1231262955
        * seenxu
          make maine_coon.js works with vimperator 3.6.1)

    == Maine Coon ==
        http://en.wikipedia.org/wiki/Maine_Coon

    ]]></code>
  </p>
</plugin>`;

(function () {

    let U = libly.$U;
    let messageBox = document.getElementById('liberator-message');
    let bottomBar = document.getElementById('liberator-bottombar');
    let commandlineBox = document.getElementById('liberator-commandline-command');

    function s2b (s, d) !!((!/^(\d+|false)$/i.test(s)|parseInt(s)|!!d*2)&1<<!s);

    function delay (f, t) {
        setTimeout(f, t || 0);
    }

    function nothing (value)
        (value === undefined);

    function focusToCommandline () {
        commandlineBox.inputField.focus();
    }

    let setAutoHideCommandLine = (function () {
        let hiddenNodes = [];

        return function (hide) {
            hide = !!hide;

            if (hide === autoHideCommandLine)
                return;

            autoHideCommandLine = hide;

            if (hide) {
                bottomBar.collapsed = true;
                let cs = messageBox.parentNode.childNodes;
                hiddenNodes = [];
                for (let i = 0, l = cs.length, c; i < l; i++) {
                    c = cs[i];
                    if (c.id == 'liberator-commandline')
                        continue;
                    let style = window.getComputedStyle(c, '');
                    hiddenNodes.push([c, c.collapsed, style.display]);
                    if (c.id != 'liberator-message')
                        c.style.display = 'none';
                    c.collapsed = true;
                }
            } else {
                bottomBar.collapsed = false;
                hiddenNodes.forEach(
                function ([c, v, d]) [c.collapsed, c.style.display] = [v, d]);
            }
        }
    })();

    let autoHideCommandLine = false;
    let inputting = false;
    {
        let a = liberator.globalVariables.maine_coon_auto_hide;
        let d = liberator.globalVariables.maine_coon_default;

        let def = !nothing(d) ? d :
                  nothing(a)  ? 'amu' :
                  s2b(a)      ? 'amu' :
                  'm';

        autocommands.add(
            'VimperatorEnter',
            /.*/,
            function () delay(function () options.get('mainecoon').set(def))
        );
    }

    U.around(commandline, 'input', function (next, args) {
        let result = next();
        inputting = true;
        bottomBar.collapsed = false;
        focusToCommandline();
        return result;
    }, true);

    U.around(commandline, 'open', function (next, args) {
        let result = next();
        bottomBar.collapsed = false;
        focusToCommandline();
        return result;
    }, true);

    U.around(commandline, 'close', function (next, args) {
        if (autoHideCommandLine && !inputting)
            bottomBar.collapsed = true;
        return next();
    }, true);

    U.around(commandline._callbacks.submit, modes.EX, function (next, args) {
        let r = next();
        if (autoHideCommandLine && !inputting && !(
            modes.extended & modes.OUTPUT_MULTILINE))
            commandline.close();
        return r;
    }, true);

    let (
        callback = function (next) {
            if (autoHideCommandLine)
                bottomBar.collapsed = true;
            inputting = false;
            return next();
        }
    ) {
        U.around(commandline._callbacks.submit, modes.PROMPT, callback, true);
        U.around(commandline._callbacks.cancel, modes.PROMPT, callback, true);
    }

    options.add(
        ['mainecoon'],
        'Make big screen like a Maine Coon',
        'charlist',
        '',
        {
            setter: function (value) {
                function has (c)
                    (value.indexOf(c) >= 0);

                setAutoHideCommandLine(has('a'));

                return value;
            },
            completer: function (context, args) {
                context.title = ['Value', 'Description'];
                context.completions = [
                    ['c', 'Hide caption bar'],
                    ['a', 'Hide automatically command-line'],
                    ['C', 'Hide caption bar (maximize)'],
                ];
            },
            validater: function (value) /^[cfa]*$/.test(value)
        }
    );

})();

/** EOF
 *  vim:smarttab:ts=4:sw=4:ai:
 */
