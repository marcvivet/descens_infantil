import sys
import time


class ProgressEta(object):
    def __init__(self, description, total_elements):
        self.description = description
        self.total_elements = total_elements

        self.start_time = None
        self.progress_counter = 0
        self.start()
        self.timer_ended = False

    def __format_as_time(self, input_seconds):
        """Given a number of seconds it converts into this format: HH:MM:SS.SSSS

        Arguments:
            input_seconds {float} -- Number in seconds

        returns:
            formated string
        """

        used_time = 0.0
        hours = int(input_seconds / 3600.0)
        used_time += hours * 3600.0
        minutes = int((input_seconds - used_time) / 60)
        used_time += minutes * 60.0
        seconds = input_seconds - used_time

        return '{:02}:{:02}:{:02}'.format(hours, minutes, int(seconds))

    def start(self):
        self.start_time = time.time()
        self.progress_counter = 0
        self.timer_ended = False

    def end(self):
        self.timer_ended = True
        print('')

    def step(self, progress_counter=None):
        """Prints the estimated time remaining
        """

        if self.timer_ended:
            return

        if progress_counter:
            self.progress_counter = progress_counter
        else:
            self.progress_counter += 1

        end_time = time.time()

        remaining_time = (((end_time - self.start_time) / self.progress_counter) *
                          (self.total_elements - self.progress_counter))

        remaining = self.__format_as_time(remaining_time)
        elapsed = self.__format_as_time(end_time - self.start_time)

        progress_act = (self.progress_counter / self.total_elements) * 100.0

        sys.stdout.write(
            '\r{:.<28s}{:.>9s} of {:.<9s}{: >8s} {} - {}'.format(
                '{} '.format(self.description), ' {}'.format(self.progress_counter),
                '{} '.format(self.total_elements),
                ' {:.2f}%'.format(progress_act), remaining, elapsed))
        sys.stdout.flush()

        if self.progress_counter == self.total_elements:
            self.end()


class ProgressDecorator(object):
    def __init__(self, text, num_elements):
        self.text = text
        self.timer = ProgressEta(text, num_elements)

    def __call__(self, f):
        def wrapped_f(*args, **kwargs):
            f(*args, **kwargs)
            self.timer.step()

        return wrapped_f
