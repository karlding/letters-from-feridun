var TimeLine = {
  /**
   * @param id      DOM element id
   * @param events  a sorted list of events
   */
  draw: function(id, events) {
    var config = {
      height: 100,
      width: window.innerWidth - 50,
      radius: 4,
      lineWidth: 2,
      color: 'black',
      background: 'white',
      labelDateFormat: '%b %d, %Y %H:%M:%S',
      axisDateFormat: '%b %d %Y',
    };

    var today = Date.parse(new Date());

    var toolTip = d3.select(id)
      .insert('div')
      .attr('class', 'tooltip');

    var svg = d3.select(id)
      .append('svg')
      .attr('viewBox', '0, 0, ' + config.width + ', ' + config.height)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', config.width)
      .attr('height', config.height);

    var timestamps = events.map(function(d) {
      return Date.parse(d.date);
    });
    var maxValue = d3.max(timestamps);
    var minValue = d3.min(timestamps);
    var margin = (config.radius * 1.5) + config.lineWidth;
    var step = (config.width - (2 * margin)) / (d3.max([maxValue, today]) - minValue);

    // push to events to force the line to get drawn
    events.push({
      date: today,
      subject: 'Today',
    });

    if (maxValue === minValue) {
      // if only one value
      step = 0;
      margin = config.width / 2;
    }

    prevLine = {
      x1 : null,
      x2 : null,
      y1 : null,
      y2 : null,
    };

    svg.selectAll('line')
      .data(events).enter()
      .append('line')
      .attr('class', 'timeline-line')
      .attr('x1', function(d) {
        var datum = new Date(d.date).getTime();
        var ret = Math.floor(step * (datum - minValue) + margin);
        prevLine.x1 = ret;

        return ret;
      })
      .attr('x2', function(d) {
        if (prevLine.x1 !== null) {
          return prevLine.x1;
        }
        var datum = new Date(d.date).getTime();

        return Math.floor(config.width / 2);
      })
      .attr('y1', function(d) {
        var ret = Math.floor(config.height / 2);
        prevLine.y1 = ret;

        return ret;
      })
      .attr('y2', function(d) {
        if (prevLine.y1 !== null) {
          return prevLine.y1;
        }
        return Math.floor(config.height / 2);
      })
      .style('stroke', function(d) {
        return config.color;
      })
      .style('stroke-width', function(d) {
        return config.lineWidth;
      });

    svg.selectAll('circle')
      .data(events.filter(function(d) {
        // don't draw circle for today
        return d.date !== today;
      })).enter()
      .append('circle')
      .attr('class', 'timeline-event')
      .attr('id', function(d) {
        var date = Date.parse(d.date);
        return 'time-' + date;
      })
      .attr('r', function(d) {
        return config.radius;
      })
      .style('stroke', function(d) {
        return config.color;
      })
      .style('stroke-width', function(d) {
        return config.lineWidth;
      })
      .style('fill', function(d) {
        return config.background;
      })
      .attr('cy', function(d) {
        return Math.floor(config.height / 2);
      })
      .attr('cx', function(d) {
        var datum = new Date(d.date).getTime();

        return Math.floor(step * (datum - minValue) + margin);
      }).on('mouseover', function(d) {
        var format = d3.time.format(config.labelDateFormat);
        var datetime = format(new Date(d.date));
        var dateValue = '<small>' + datetime + '</small>';

        d3.select(this)
          .style('fill', function(d) {
            return config.color;
          })
          .transition()
          .duration(100).attr('r', function(d) {
            var format = d3.time.format('%A %b %d, %Y at %H:%M:%S %p');
            var date = new Date(d.date);
            var dateString = format(date);
            var content = (d.content !== undefined) ? d.content : '';

            document.querySelectorAll('#message')[0].innerHTML = '<h2>' + d.subject + '</h2>' + dateString + content;

            return Math.floor(config.radius * 1.5);
          });

        toolTip.html('');
        toolTip.append('div')
          .html(dateValue);
        toolTip.transition()
          .duration(100)
          .style('opacity', 0.9);
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('fill', function(d) {
            return config.background;
          })
          .transition()
          .duration(100).attr('r', function(d) {
            return config.radius;
          });
        toolTip.transition()
          .duration(100)
          .style('opacity', 0);
      })
      .on('click', function(e) {
        var format = d3.time.format('%A %b %d, %Y at %H:%M:%S %p');
        var date = new Date(e.date);
        var dateString = format(date);
        var content = (e.content !== undefined) ? e.content : '';

        document.querySelectorAll('#message')[0].innerHTML = '<h2>' + e.subject + '</h2>' + dateString + content;
      });

    // start + end labels
    var format = d3.time.format(config.axisDateFormat);
    var startString = format(new Date(minValue));
    var endString = format(new Date(maxValue));

    svg.append('text')
      .text(startString)
      .attr('class', 'timeline-label')
      .attr('x', function(d) {
        return d3.max([0, (margin - this.getBBox().width / 2)]);
      })
      .attr('y', function(d) {
        return Math.floor((config.height / 2) + (margin + this.getBBox().height));
      });

    svg.append('text')
      .text(endString)
      .attr('class', 'timeline-label')
      .attr('x', function(d) {
        return d3.min([config.width - step * (d3.max([maxValue, today]) - maxValue) - margin - (this.getBBox().width / 2),
          config.width - d3.max([this.getBBox().width, (margin + (this.getBBox().width / 2))])]);
      })
      .attr('y', function(d) {
        return Math.floor((config.height / 2) + (margin + this.getBBox().height));
      });

    // update tooltip position
    svg.on('mousemove', function() {
      // TODO: realign when mouse cursor is on the right side of the page
      toolTipHeight = parseInt(toolTip.style('height').replace('px', ''));
      toolTipWidth = parseInt(toolTip.style('width').replace('px', ''));
      return toolTip.style('top', (d3.event.pageY - toolTipHeight - margin) + 'px')
        .style('left', (d3.event.pageX + 20) + 'px');
    })
      .on('mouseout', function() {
        return toolTip.style('opacity', 0)
          .style('left', 0)
          .style('top', 0);
      });
  }
};
