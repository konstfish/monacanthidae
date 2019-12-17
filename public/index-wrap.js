function updZ(e, i){
      //console.log("setting to " + i)
      $(e).css("zIndex", i)
    }

    anim_albs = []

    const animDelay = 500
    const animDelay_l = 600

    const dist = 220

    $('.album').mouseenter(function(e){
      console.log(anim_albs)
      if(!anim_albs.includes($(this).attr('id'))){
        anim_albs.push($(this).attr('id'))
        console.log(anim_albs.includes($(this).attr('id')))

        var c = $(this).children('img')
        // 1

        var tw1_r = KUTE.fromTo(
          c[0],
          {translate:[0,0], rotate: -4},
          {translate:[dist,0], rotate: 8},
          {easing: 'easingQuinticInOut', duration: animDelay},
        );

        var tw1_l = KUTE.fromTo(
          c[0],
          {translate:[dist,0], rotate: 8},
          {translate:[0,0], rotate: -4},
          {easing: 'easingQuinticInOut', duration: animDelay_l},
        );

      tw1_r.start();
      setTimeout(function(){updZ(c[0], -1)}, animDelay)
      tw1_r.chain(tw1_l);

      //  2

      var tw2_r = KUTE.fromTo(
        c[1],
        {translate:[0,0], rotate: 0},
        {translate:[dist,0], rotate: -6},
        {easing: 'easingQuinticInOut', duration: animDelay},
      );

      var tw2_l = KUTE.fromTo(
        c[1],
        {translate:[dist,0], rotate: -6},
        {translate:[0,0], rotate: 0},
        {easing: 'easingQuinticInOut', duration: animDelay_l},
      );

      tw1_l.chain(tw2_r);
      setTimeout(function(){updZ(c[1], -2)}, animDelay * 3 + 100)
      tw2_r.chain(tw2_l);

      //  3

      var tw3_r = KUTE.fromTo(
        c[2],
        {translate:[0,0], rotate: 4},
        {translate:[dist,0], rotate: 8},
        {easing: 'easingQuinticInOut', duration: animDelay},
      );

      var tw3_l = KUTE.fromTo(
        c[2],
        {translate:[dist,0], rotate: 8},
        {translate:[0,0], rotate: 4},
        {easing: 'easingQuinticInOut', duration: animDelay_l},
      );

      tw2_l.chain(tw3_r);
      setTimeout(function(){updZ(c[0], 3); updZ(c[1], 2); }, animDelay * 5 + 200)
      tw3_r.chain(tw3_l);

      setTimeout(function(){ anim_albs.splice(anim_albs.indexOf($(this).attr('id')), 1); }, animDelay * 6 + 300)
    }
    })
