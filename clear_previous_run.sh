lab=/home/ojas/iiith/vlabs/phychemt/physical-chemistry-iiith/src/lab
ensrc=/home/ojas/iiith/vlabs/phychemt/eng/
rm -rf $lab
rm -rf $lab
rsync -az 
rsync -az $ensrc $lab
