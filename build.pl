use strict; local $/;
sub r{my $n=shift;open(my $f,'<:raw',"src/$n") or die "missing $n";my $c=<$f>;close $f;$c}
my $head=r('head.html'); my $css=r('extra.css');
$head=~s{</style></head>}{$css</style></head>} or die 'no style end';
$head=~s{<meta name="viewport" content="[^"]*">}{<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1,user-scalable=no"><meta name="referrer" content="no-referrer"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes">} or die 'no viewport';
$head=~s{<small class="controls">[^<]*</small>}{<small class="controls">W A S D للحركة · Shift للجري · اسحب للنظر · العجلة للتقريب · F للتفاعل</small>} or die 'no controls';
my $gloss=r('gloss.js');
my $world=r('world1.js').r('world2.js').r('world3.js');
my $sound=-e 'src/sound.js'?r('sound.js'):r('sound.orig.js');
my $out=$head."\n<script>".$gloss."</script><script>".$world."</script><script>".$sound."</script><script>".r('lessons.js')."</script><script>".r('main.js').r('tail.html');
open(my $o,'>:raw','game/Duroob-Al-Hamra.html') or die;print $o $out;close $o;print length($out)," bytes\n";
